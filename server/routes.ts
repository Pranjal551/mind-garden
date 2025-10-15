import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { selectRepo } from "./repo/selectRepo";
import { triageScore } from "./logic/triage";
import { pickHospital, findAlternativeRoute } from "./logic/routing";
import { insertEmergencySchema } from "@shared/schema";
import type { Emergency, HospitalCapability } from "@shared/schema";
import { randomUUID } from "crypto";
import { setupWebSocket, broadcastEmergency } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  const repo = selectRepo();
  const httpServer = createServer(app);
  
  setupWebSocket(httpServer);

  // Emergency routes with enhanced functionality
  app.get("/api/emergencies", async (req, res) => {
    try {
      // Maintain backward compatibility - return legacy format by default
      const legacyEmergencies = await storage.getAllEmergencies();
      res.json(legacyEmergencies);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      res.status(500).json({ message: "Failed to fetch emergencies" });
    }
  });

  // New endpoint for enhanced emergencies with filtering
  app.get("/api/emergencies/enhanced", async (req, res) => {
    try {
      const { status, triage_level, needs } = req.query;
      
      const filter: any = {};
      if (status) filter.status = Array.isArray(status) ? status : [status];
      if (triage_level) filter.triage_level = Array.isArray(triage_level) ? triage_level : [triage_level];
      if (needs) filter.needs = Array.isArray(needs) ? needs : [needs];

      const emergencies = await repo.listEmergencies(filter);
      res.json(emergencies);
    } catch (error) {
      console.error('Error fetching enhanced emergencies:', error);
      res.status(500).json({ message: "Failed to fetch enhanced emergencies" });
    }
  });

  app.get("/api/emergencies/:id", async (req, res) => {
    try {
      const emergency = await storage.getEmergency(req.params.id);
      if (!emergency) {
        return res.status(404).json({ message: "Emergency not found" });
      }
      res.json(emergency);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emergency" });
    }
  });

  app.post("/api/emergencies", async (req, res) => {
    try {
      const validatedData = insertEmergencySchema.parse(req.body);
      
      // Create emergency using old storage for backward compatibility
      const legacyEmergency = await storage.createEmergency(validatedData);
      
      // Also create using enhanced system if data supports it
      let enhancedEmergency = null;
      if (req.body.enhanced && req.body.lat && req.body.lon && req.body.patient_id) {
        const { lat, lon, patient_id, type, vitals } = req.body;
        
        // Calculate triage score
        const triage = triageScore(vitals || {}, type);
        
        const newEmergency = {
          patient_id,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          type: type || 'Unknown',
          needs: triage.needs,
          triage_score: triage.score,
          vitals: vitals || null
        };
        
        enhancedEmergency = await repo.createEmergency(newEmergency);
        
        // Add creation incident event
        await repo.addIncidentEvent({
          id: randomUUID(),
          emergency_id: enhancedEmergency.id,
          kind: 'created',
          data: { triage, routing_attempted: false },
          ts: new Date()
        });
        
        // Attempt hospital routing
        try {
          const hospitals = await repo.listHospitals();
          const routing = pickHospital(enhancedEmergency as any, hospitals as any);
          
          if (routing.primary && routing.primary.available) {
            await repo.updateEmergency(enhancedEmergency.id, {
              assigned_hospital_id: routing.primary.hospital.id,
              assigned_eta_min: routing.primary.eta,
              status: 'assigned'
            });
            
            // Log assignment
            await repo.addIncidentEvent({
              id: randomUUID(),
              emergency_id: enhancedEmergency.id,
              kind: 'assigned',
              data: { hospital: routing.primary.hospital, eta: routing.primary.eta },
              ts: new Date()
            });
          }
          
          await repo.addIncidentEvent({
            id: randomUUID(),
            emergency_id: enhancedEmergency.id,
            kind: 'triage',
            data: { routing_result: routing },
            ts: new Date()
          });
        } catch (routingError) {
          console.warn('Hospital routing failed:', routingError);
        }
      }
      
      // Broadcast emergency creation to all connected WebSocket clients
      broadcastEmergency('emergency_created', {
        legacy: legacyEmergency,
        enhanced: enhancedEmergency
      });
      
      // Maintain backward compatibility - return only the legacy emergency
      res.status(201).json(legacyEmergency);
    } catch (error) {
      console.error('Emergency creation error:', error);
      res.status(400).json({ message: "Invalid emergency data", error });
    }
  });

  app.patch("/api/emergencies/:id", async (req, res) => {
    try {
      const partialData = insertEmergencySchema.partial().parse(req.body);
      const emergency = await storage.updateEmergency(req.params.id, partialData);
      if (!emergency) {
        return res.status(404).json({ message: "Emergency not found" });
      }
      
      // Broadcast emergency update to all connected WebSocket clients
      broadcastEmergency('emergency_updated', emergency);
      
      res.json(emergency);
    } catch (error) {
      res.status(400).json({ message: "Invalid emergency data", error });
    }
  });

  // Enhanced emergency creation endpoint with triage and routing
  app.post("/api/emergencies/enhanced", async (req, res) => {
    try {
      // Validate enhanced emergency data
      const { patient_id, lat, lon, type, vitals, needs } = req.body;
      
      if (!patient_id || !lat || !lon || !type) {
        return res.status(400).json({ message: "Missing required fields: patient_id, lat, lon, type" });
      }

      // Calculate triage score
      const triage = triageScore(vitals || {}, type);
      
      const newEmergency = {
        patient_id,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        type,
        needs: needs || triage.needs,
        triage_score: triage.score,
        vitals: vitals || null
      };
      
      const enhancedEmergency = await repo.createEmergency(newEmergency);
      
      // Add creation incident event
      await repo.addIncidentEvent({
        id: randomUUID(),
        emergency_id: enhancedEmergency.id,
        kind: 'created',
        data: { triage, routing_attempted: false },
        ts: new Date()
      });
      
      // Attempt hospital routing
      try {
        const hospitals = await repo.listHospitals();
        const routing = pickHospital(enhancedEmergency as any, hospitals as any);
        
        if (routing.primary && routing.primary.available) {
          await repo.updateEmergency(enhancedEmergency.id, {
            assigned_hospital_id: routing.primary.hospital.id,
            assigned_eta_min: routing.primary.eta,
            status: 'assigned'
          });
          
          // Log assignment
          await repo.addIncidentEvent({
            id: randomUUID(),
            emergency_id: enhancedEmergency.id,
            kind: 'assigned',
            data: { hospital: routing.primary.hospital, eta: routing.primary.eta },
            ts: new Date()
          });
        }
        
        await repo.addIncidentEvent({
          id: randomUUID(),
          emergency_id: enhancedEmergency.id,
          kind: 'triage',
          data: { routing_result: routing },
          ts: new Date()
        });
      } catch (routingError) {
        console.warn('Hospital routing failed:', routingError);
      }
      
      res.status(201).json(enhancedEmergency);
    } catch (error) {
      console.error('Enhanced emergency creation error:', error);
      res.status(400).json({ message: "Invalid enhanced emergency data", error });
    }
  });

  // Enhanced API endpoints
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await repo.listHospitals();
      res.json(hospitals);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });
  
  app.get("/api/emergencies/:id/timeline", async (req, res) => {
    try {
      const events = await repo.listIncidentEvents(req.params.id);
      res.json(events);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({ message: "Failed to fetch incident timeline" });
    }
  });
  
  app.post("/api/emergencies/:id/reroute", async (req, res) => {
    try {
      const emergency = await repo.getEmergency(req.params.id);
      if (!emergency) {
        return res.status(404).json({ message: "Emergency not found" });
      }
      
      const hospitals = await repo.listHospitals();
      const excludeIds = emergency.assigned_hospital_id ? [emergency.assigned_hospital_id] : [];
      
      const rerouting = findAlternativeRoute(emergency as any, hospitals as any, excludeIds);
      
      if (rerouting.primary && rerouting.primary.available) {
        await repo.updateEmergency(req.params.id, {
          rerouted_to_id: rerouting.primary.hospital.id,
          assigned_eta_min: rerouting.primary.eta,
          status: 'assigned'
        });
        
        await repo.addIncidentEvent({
          id: randomUUID(),
          emergency_id: req.params.id,
          kind: 'reroute',
          data: {
            from_hospital_id: emergency.assigned_hospital_id,
            to_hospital: rerouting.primary.hospital,
            reason: req.body.reason || 'Manual reroute',
            eta: rerouting.primary.eta
          },
          ts: new Date()
        });
        
        res.json({ success: true, hospital: rerouting.primary.hospital, eta: rerouting.primary.eta });
      } else {
        res.status(400).json({ message: "No alternative hospitals available", routing: rerouting });
      }
    } catch (error) {
      console.error('Reroute error:', error);
      res.status(500).json({ message: "Failed to reroute emergency" });
    }
  });
  
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const emergencies = await repo.listEmergencies();
      const hospitals = await repo.listHospitals();
      
      // Calculate stats
      const stats = {
        total_emergencies: emergencies.length,
        active: emergencies.filter(e => e.status === 'active').length,
        assigned: emergencies.filter(e => e.status === 'assigned').length,
        enroute: emergencies.filter(e => e.status === 'enroute').length,
        completed: emergencies.filter(e => e.status === 'completed').length,
        hospitals_count: hospitals.length,
        hospitals_accepting: hospitals.filter(h => h.accepting_emergencies).length
      };
      
      res.json({
        stats,
        emergencies: emergencies.slice(0, 50), // Latest 50 
        hospitals: hospitals
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Hospital management routes
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await repo.listHospitals();
      res.json(hospitals);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const hospital = await repo.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      console.error('Error fetching hospital:', error);
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  app.patch("/api/hospitals/:id", async (req, res) => {
    try {
      const hospital = await repo.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      const updates = {
        beds_available: req.body.bedsAvailable,
        doctors_available: req.body.doctorsAvailable,
        capabilities: req.body.capabilities,
        accepting_emergencies: req.body.acceptingEmergencies
      };

      await repo.upsertHospital({ ...hospital, ...updates });
      const updated = await repo.getHospital(req.params.id);
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating hospital:', error);
      res.status(500).json({ message: "Failed to update hospital" });
    }
  });

  app.post("/api/hospitals/:id/set-unavailable", async (req, res) => {
    try {
      const { id } = req.params;
      const { emergencyId, reason } = req.body;
      
      const hospital = await repo.getHospital(id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      // Mark hospital as not accepting emergencies
      await repo.upsertHospital({ 
        ...hospital, 
        accepting_emergencies: false 
      });

      // If there's an emergency assigned to this hospital, reroute it
      if (emergencyId) {
        const emergency = await repo.getEmergency(emergencyId);
        if (emergency) {
          const hospitals = await repo.listHospitals();
          const excludeIds = [id];
          
          const rerouting = findAlternativeRoute(emergency as any, hospitals as any, excludeIds);
          
          if (rerouting.primary && rerouting.primary.available) {
            await repo.updateEmergency(emergencyId, {
              rerouted_to_id: rerouting.primary.hospital.id,
              assigned_eta_min: rerouting.primary.eta,
              status: 'assigned'
            });
            
            await repo.addIncidentEvent({
              id: randomUUID(),
              emergency_id: emergencyId,
              kind: 'reroute',
              data: {
                from_hospital_id: id,
                to_hospital: rerouting.primary.hospital,
                reason: reason || 'Hospital marked as unavailable',
                eta: rerouting.primary.eta
              },
              ts: new Date()
            });
            
            return res.json({ 
              success: true, 
              rerouted: true,
              newHospital: rerouting.primary.hospital, 
              eta: rerouting.primary.eta 
            });
          } else {
            return res.json({ 
              success: true, 
              rerouted: false,
              message: "No alternative hospitals available"
            });
          }
        }
      }

      res.json({ success: true, rerouted: false });
    } catch (error) {
      console.error('Error marking hospital unavailable:', error);
      res.status(500).json({ message: "Failed to mark hospital unavailable" });
    }
  });

  app.post("/api/hospitals/import-csv", async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ message: "No CSV data provided" });
      }

      const lines = csvData.trim().split('\n');
      let imported = 0;

      for (const line of lines) {
        const [name, lat, lon, beds, doctors, capabilities, accepting] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        
        if (!name || !lat || !lon) continue;

        const hospital: Hospital = {
          id: randomUUID(),
          name,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          beds_available: parseInt(beds) || 0,
          doctors_available: parseInt(doctors) || 0,
          capabilities: capabilities ? capabilities.split(';') : [],
          accepting_emergencies: accepting?.toLowerCase() === 'true',
          created_at: new Date()
        };

        await repo.upsertHospital(hospital);
        imported++;
      }

      res.json({ message: `Imported ${imported} hospitals`, imported });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });

  // Ambulance position tracking routes
  app.post("/api/ambulance/positions", async (req, res) => {
    try {
      const { positions } = req.body;
      if (!positions || !Array.isArray(positions)) {
        return res.status(400).json({ message: "Invalid positions data" });
      }

      // Save positions to database
      const savedPositions = [];
      for (const position of positions) {
        if (!position.ambulanceId || !position.lat || !position.lon) {
          continue; // Skip invalid positions
        }
        
        await repo.addAmbulancePosition({
          ambulance_id: position.ambulanceId,
          lat: position.lat,
          lon: position.lon,
          ts: new Date()
        });
        savedPositions.push(position);
      }

      res.json({ 
        message: `Saved ${savedPositions.length} positions`,
        positions: savedPositions 
      });
    } catch (error) {
      console.error('Error saving ambulance positions:', error);
      res.status(500).json({ message: "Failed to save positions" });
    }
  });

  app.get("/api/ambulance/positions/:ambulanceId", async (req, res) => {
    try {
      const { ambulanceId } = req.params;
      const { limit = 100 } = req.query;
      
      const positions = await repo.listAmbulancePositions(ambulanceId, Number(limit));
      res.json(positions);
    } catch (error) {
      console.error('Error fetching ambulance positions:', error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  return httpServer;
}
