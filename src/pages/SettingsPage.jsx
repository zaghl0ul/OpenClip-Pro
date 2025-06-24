import React, { useState } from 'react';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import SettingsHeader from '../components/settings/SettingsHeader';
import ApiSettings from '../components/settings/ApiSettings';
import AppSettings from '../components/settings/AppSettings';
import PerformanceSettings from '../components/settings/PerformanceSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('api');
  const { initialize, isLoading } = useSettingsStore();

  const renderContent = () => {
    switch (activeSection) {
      case 'api':
        return <ApiSettings />;
      case 'app':
        return <AppSettings />;
      case 'performance':
        return <PerformanceSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <ApiSettings />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <SettingsHeader />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
