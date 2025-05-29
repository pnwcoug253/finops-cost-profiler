import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Content,
  Theme
} from '@carbon/react';
import { Switcher, Help, UserAvatar } from '@carbon/icons-react';

// Import pages
import Dashboard from './pages/Dashboard';
import CostProfiles from './pages/CostProfiles';
import CreateProfile from './pages/CreateProfile';
import Resources from './pages/Resources';
import Allocations from './pages/Allocations';

// Import sample data
import { sampleVMs } from './data/sampleData';

function AppContent() {
  const location = useLocation();
  const [costProfiles, setCostProfiles] = useState([]);
  const [resources, setResources] = useState([]);

  // Load initial data
  useEffect(() => {
    // Load cost profiles from localStorage
    const savedProfiles = localStorage.getItem('costProfiles');
    if (savedProfiles) {
      setCostProfiles(JSON.parse(savedProfiles));
    }

    // Load sample VMs
    setResources(sampleVMs);
  }, []);

  // Save cost profiles to localStorage whenever they change
  useEffect(() => {
    if (costProfiles.length > 0) {
      localStorage.setItem('costProfiles', JSON.stringify(costProfiles));
    }
  }, [costProfiles]);

  return (
    <>
      <Header aria-label="FinOps Cost Profiler">
        <SkipToContent />
        <HeaderName element={Link} to="/" prefix="FinOps">
          Cost Profiler
        </HeaderName>
        <HeaderNavigation aria-label="Main Navigation">
          <HeaderMenuItem 
            element={Link} 
            to="/" 
            isActive={location.pathname === '/'}
          >
            Dashboard
          </HeaderMenuItem>
          <HeaderMenuItem 
            element={Link} 
            to="/cost-profiles"
            isActive={location.pathname.includes('/cost-profiles')}
          >
            Cost Profiles
          </HeaderMenuItem>
          <HeaderMenuItem 
            element={Link} 
            to="/resources"
            isActive={location.pathname === '/resources'}
          >
            Resources
          </HeaderMenuItem>
          <HeaderMenuItem 
            element={Link} 
            to="/allocations"
            isActive={location.pathname === '/allocations'}
          >
            Cost Allocations
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label="Help" tooltipAlignment="end">
            <Help size={20} />
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="User Profile" tooltipAlignment="end">
            <UserAvatar size={20} />
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="App Switcher" tooltipAlignment="end">
            <Switcher size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>

      <Content>
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                costProfiles={costProfiles} 
                resources={resources} 
              />
            } 
          />
          <Route 
            path="/cost-profiles" 
            element={
              <CostProfiles 
                costProfiles={costProfiles} 
                setCostProfiles={setCostProfiles} 
              />
            } 
          />
          <Route 
            path="/cost-profiles/create" 
            element={
              <CreateProfile 
                costProfiles={costProfiles} 
                setCostProfiles={setCostProfiles} 
              />
            } 
          />
          <Route 
            path="/cost-profiles/edit/:id" 
            element={
              <CreateProfile 
                costProfiles={costProfiles} 
                setCostProfiles={setCostProfiles} 
                editMode={true}
              />
            } 
          />
          <Route 
            path="/resources" 
            element={<Resources resources={resources} />} 
          />
          <Route 
            path="/allocations" 
            element={
              <Allocations 
                costProfiles={costProfiles} 
                resources={resources} 
              />
            } 
          />
        </Routes>
      </Content>
    </>
  );
}

function App() {
  return (
    <Theme theme="white">
      <Router>
        <AppContent />
      </Router>
    </Theme>
  );
}

export default App;