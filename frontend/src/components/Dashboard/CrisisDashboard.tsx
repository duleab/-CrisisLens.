// ======================================================================
// CrisisLens Production Dashboard - React Component
// ======================================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Paper, Typography, Card, CardContent, Box, 
  Select, MenuItem, FormControl, InputLabel, Chip,
  Alert, CircularProgress, Tabs, Tab, Switch, FormControlLabel
} from '@mui/material';
import { 
  Timeline, LocationOn, Warning, TrendingUp, 
  Chat, Map as MapIcon, Assessment 
} from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCrisisData } from '../../hooks/useCrisisData';
import { CrisisMap } from './CrisisMap';
import { CrisisStats } from './CrisisStats';
import { CrisisTimeline } from './CrisisTimeline';
import { AIChatInterface } from './AIChatInterface';
import { RealTimeAlerts } from './RealTimeAlerts';
import { CrisisEvent, AgentRole } from '../../types/crisis';

interface CrisisDashboardProps {
  userRole?: AgentRole;
  initialView?: 'map' | 'stats' | 'chat' | 'timeline';
}

export const CrisisDashboard: React.FC<CrisisDashboardProps> = ({
  userRole = 'citizen',
  initialView = 'map'
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<string>(initialView);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>(userRole);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [mapFilters, setMapFilters] = useState({
    severity: 'all',
    crisisType: 'all',
    timeRange: 24
  });

  // Custom hooks for data and WebSocket
  const { 
    events, 
    stats, 
    loading, 
    error, 
    refetch 
  } = useCrisisData(mapFilters);
  
  const { 
    connected, 
    messages, 
    sendMessage 
  } = useWebSocket(`/ws/dashboard-${Date.now()}`);

  // Real-time event handler
  useEffect(() => {
    if (realTimeEnabled && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage.type === 'new_events') {
        // Auto-refresh data when new events arrive
        refetch();
      }
    }
  }, [messages, realTimeEnabled, refetch]);

  // Agent role configurations
  const agentConfigs = {
    citizen: {
      name: '👥 Citizen View',
      color: '#2196F3',
      defaultPrompts: [
        'Is my area safe right now?',
        'Where is the nearest shelter?',
        'What should I do if there\'s an earthquake?'
      ]
    },
    tourist: {
      name: '✈️ Tourist View', 
      color: '#FF9800',
      defaultPrompts: [
        'Is it safe to travel to Jakarta?',
        'Airport status and delays?',
        'Tourist-friendly emergency contacts?'
      ]
    },
    responder: {
      name: '🚑 Emergency Responder',
      color: '#F44336',
      defaultPrompts: [
        'Priority areas for deployment?',
        'Hospital capacity status?',
        'Safest routes to affected areas?'
      ]
    },
    government: {
      name: '🏛️ Government View',
      color: '#9C27B0', 
      defaultPrompts: [
        'Generate situation report',
        'Resource allocation recommendations',
        'Inter-agency coordination status'
      ]
    },
    ngo: {
      name: '🤝 NGO Operations',
      color: '#4CAF50',
      defaultPrompts: [
        'Vulnerable population needs?',
        'Supply distribution priorities?',
        'Volunteer coordination hubs?'
      ]
    },
    media: {
      name: '📰 Media Center',
      color: '#607D8B',
      defaultPrompts: [
        'Generate press release',
        'Verified casualty numbers?',
        'Official spokesperson contacts'
      ]
    },
    business: {
      name: '🏢 Business Continuity',
      color: '#795548',
      defaultPrompts: [
        'Supply chain disruptions?',
        'Employee safety status?',
        'Business impact assessment'
      ]
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleAgentChange = (event: SelectChangeEvent<AgentRole>) => {
    setSelectedAgent(event.target.value as AgentRole);
  };

  const handleChatMessage = useCallback((message: string) => {
    sendMessage({
      type: 'chat',
      content: message,
      agent_role: selectedAgent,
      timestamp: new Date().toISOString()
    });
  }, [selectedAgent, sendMessage]);

  // Loading state
  if (loading && !events.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading crisis intelligence...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              🚨 CrisisLens AI Platform
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              One Crisis. Multiple Perspectives. Smarter Decisions.
            </Typography>
          </Grid>
          
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Real-time toggle */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={realTimeEnabled}
                    onChange={(e) => setRealTimeEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label="Live Updates"
              />
              
              {/* Connection status */}
              <Chip 
                icon={<Timeline />}
                label={connected ? "Connected" : "Disconnected"}
                color={connected ? "success" : "error"}
                variant="outlined"
                size="small"
              />

              {/* Agent selector */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>AI Assistant</InputLabel>
                <Select
                  value={selectedAgent}
                  label="AI Assistant"
                  onChange={handleAgentChange}
                >
                  {Object.entries(agentConfigs).map(([role, config]) => (
                    <MenuItem key={role} value={role}>
                      {config.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>

        {/* Real-time alerts */}
        <RealTimeAlerts 
          events={events.filter(e => e.severity === 'critical').slice(0, 3)}
          enabled={realTimeEnabled}
        />
      </Box>

      {/* Error handling */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {error.message || 'Failed to load crisis data. Please try again.'}
          </Typography>
        </Alert>
      )}

      {/* Main tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Crisis Map" 
            value="map" 
            icon={<MapIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Statistics" 
            value="stats" 
            icon={<Assessment />}
            iconPosition="start"
          />
          <Tab 
            label="Timeline" 
            value="timeline" 
            icon={<Timeline />}
            iconPosition="start"
          />
          <Tab 
            label={`AI Chat (${agentConfigs[selectedAgent].name})`}
            value="chat" 
            icon={<Chat />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 'map' && (
          <CrisisMap
            events={events}
            filters={mapFilters}
            onFiltersChange={setMapFilters}
            agentRole={selectedAgent}
            height="70vh"
          />
        )}

        {activeTab === 'stats' && (
          <CrisisStats 
            stats={stats}
            events={events}
            agentRole={selectedAgent}
          />
        )}

        {activeTab === 'timeline' && (
          <CrisisTimeline 
            events={events}
            agentRole={selectedAgent}
          />
        )}

        {activeTab === 'chat' && (
          <AIChatInterface
            agentRole={selectedAgent}
            agentConfig={agentConfigs[selectedAgent]}
            onSendMessage={handleChatMessage}
            crisisContext={events.slice(0, 5)} // Top 5 events for context
          />
        )}
      </Box>

      {/* Quick action panel */}
      <Paper sx={{ position: 'fixed', bottom: 20, right: 20, p: 2, zIndex: 1000 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Quick Actions
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<Warning />}
              label={`${events.filter(e => e.severity === 'critical').length} Critical`}
              color="error"
              size="small"
              onClick={() => setActiveTab('map')}
            />
            
            <Chip 
              icon={<LocationOn />}
              label={`${events.length} Total Events`}
              color="info"
              size="small"
              onClick={() => setActiveTab('stats')}
            />
            
            <Chip 
              icon={<Chat />}
              label="Ask AI"
              color="primary"
              size="small"
              onClick={() => setActiveTab('chat')}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CrisisDashboard;