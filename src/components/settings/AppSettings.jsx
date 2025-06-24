import React, { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import ThemeSelector from '../Common/ThemeSelector'
import { Moon, Sun, Monitor, Palette, Eye } from 'lucide-react'

const AppSettings = () => {
  const {
    app,
    updateAppSetting,
    performance,
    updatePerformanceSetting,
    export: exportSettings,
    updateExportSetting
  } = useSettingsStore()
  const [showGlassDemo, setShowGlassDemo] = useState(false)
  
  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="card p-6">
        <ThemeSelector />
      </div>
      
      {/* Glass Effects Demo */}
      <div className="glass-panel p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Glass Effects Showcase
            </h4>
            <p className="text-sm text-subtle mt-1">
              Explore all available glass effect styles
            </p>
          </div>
          <button
            onClick={() => {
              // Remove the 'seen' flag and reload to show the demo
              localStorage.removeItem('glass-effect-demo-seen')
              window.location.reload()
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Show Demo
          </button>
        </div>
      </div>
      
      {/* Performance Mode */}
      <div className="glass-panel p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Performance Mode</h4>
            <p className="text-sm text-subtle mt-1">
              Reduces visual effects for better performance
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={performance?.hardwareAcceleration || false}
              onChange={(e) => updatePerformanceSetting('hardwareAcceleration', e.target.checked)}
            />
            <div className="w-11 h-6 bg-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
      
      {/* Application Preferences */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Application Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Language
            </label>
            <select
              value={app?.language || 'en'}
              onChange={(e) => updateAppSetting('language', e.target.value)}
              className="input"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Auto Save Interval (seconds)
            </label>
            <input
              type="number"
              value={app?.autoSaveInterval || 30}
              onChange={(e) => updateAppSetting('autoSaveInterval', parseInt(e.target.value))}
              className="input"
              min="10"
              max="300"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Auto Save</span>
            <input
              type="checkbox"
              checked={app?.autoSave || false}
              onChange={(e) => updateAppSetting('autoSave', e.target.checked)}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Enable Notifications</span>
            <input
              type="checkbox"
              checked={app?.enableNotifications || false}
              onChange={(e) => updateAppSetting('enableNotifications', e.target.checked)}
              className="rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Export Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Export Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Format
            </label>
            <select
              value={exportSettings?.defaultFormat || 'mp4'}
              onChange={(e) => updateExportSetting('defaultFormat', e.target.value)}
              className="input"
            >
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="avi">AVI</option>
              <option value="webm">WebM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Quality
            </label>
            <select
              value={exportSettings?.defaultQuality || '1080p'}
              onChange={(e) => updateExportSetting('defaultQuality', e.target.value)}
              className="input"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="1440p">1440p</option>
              <option value="4k">4K</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Include Watermark</span>
            <input
              type="checkbox"
              checked={exportSettings?.includeWatermark || false}
              onChange={(e) => updateExportSetting('includeWatermark', e.target.checked)}
              className="rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Frame Rate
            </label>
            <select
              value={exportSettings?.defaultFrameRate || 30}
              onChange={(e) => updateExportSetting('defaultFrameRate', parseInt(e.target.value))}
              className="input"
            >
              <option value="24">24 fps</option>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppSettings