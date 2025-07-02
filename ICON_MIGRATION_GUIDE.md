- [ ] Remove old Framer Motion icon files
- [ ] Update TypeScript types if needed
- [ ] Test in all browsers and screen sizes
- [ ] Update component documentation
- [ ] Remove unused icon dependencies

## 🛠️ Automated Migration Script

Create this script as `scripts/migrate-icons.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Icon mapping from old to new patterns
const iconMappings = {
  // Pattern: oldPattern -> newPattern
  '<PlayIcon size={24} className="w-6 h-6"': '<Icon icon={PlayIcon} size={24}',
  '<PauseIcon size={20} className="w-5 h-5"': '<Icon icon={PauseIcon} size={20}',
  // Add more mappings as needed
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Apply icon mappings
  Object.entries(iconMappings).forEach(([oldPattern, newPattern]) => {
    if (content.includes(oldPattern)) {
      content = content.replace(new RegExp(oldPattern, 'g'), newPattern);
      changed = true;
    }
  });

  // Update imports
  if (content.includes("from '../Common/icons'")) {
    content = content.replace(
      /import \{([^}]+)\} from ['"]\.\.\/Common\/icons['"];?/g,
      (match, icons) => {
        const iconList = icons.split(',').map(icon => icon.trim());
        if (!iconList.includes('Icon')) {
          iconList.unshift('Icon');
        }
        return `import { ${iconList.join(', ')} } from '../Common/icons';`;
      }
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
  }
}

// Find all React files
const files = glob.sync('src/**/*.{js,jsx,ts,tsx}');
files.forEach(migrateFile);

console.log('🎉 Icon migration complete!');
```

## 🧪 Testing Guide

### Visual Regression Testing
```jsx
// Test component for visual regression
const IconTestGrid = () => (
  <div className="grid grid-cols-8 gap-4 p-4">
    {Object.entries(iconMap).map(([name, IconComponent]) => (
      <div key={name} className="flex flex-col items-center gap-2">
        <Icon icon={IconComponent} size={24} />
        <span className="text-xs">{name}</span>
      </div>
    ))}
  </div>
);
```

### Performance Testing
```jsx
// Benchmark icon rendering performance
const IconPerformanceTest = () => {
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderCount(count => count + 100);
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>Rendered {renderCount} icons</p>
      {Array.from({ length: renderCount }, (_, i) => (
        <Icon key={i} icon={PlayIcon} size={16} />
      ))}
    </div>
  );
};
```

## 🐛 Troubleshooting

### Common Issues

**1. Icon not displaying**
```jsx
// ❌ Wrong - missing Icon wrapper
<PlayIcon size={24} />

// ✅ Correct - using Icon component
<Icon icon={PlayIcon} size={24} />
```

**2. TypeScript errors**
```typescript
// ❌ Wrong - importing icon directly
import PlayIcon from 'lucide-react/dist/esm/icons/play';

// ✅ Correct - using our typed exports
import { PlayIcon } from '../Common/icons';
```

**3. Animations not working**
```jsx
// ❌ Wrong - missing animation prop
<Icon icon={LoaderIcon} className="animate-spin" />

// ✅ Correct - using built-in animation
<Icon icon={LoaderIcon} animation="spin" />
```

**4. Size inconsistencies**
```jsx
// ❌ Wrong - conflicting size specifications
<Icon icon={PlayIcon} size={24} className="w-8 h-8" />

// ✅ Correct - single size specification
<Icon icon={PlayIcon} size={24} />
```

### Debug Mode
```jsx
// Enable debug mode for development
<Icon 
  icon={PlayIcon} 
  size={24}
  className="border border-red-500" // Visual debugging
  tooltip="Debug: PlayIcon"
/>
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Icon theme variants (outline, filled, duotone)
- [ ] Custom icon registration system
- [ ] SVG optimization and caching
- [ ] Icon search and discovery tool
- [ ] Accessibility enhancements (ARIA labels)
- [ ] Right-to-left (RTL) support
- [ ] Icon animation composer
- [ ] Design token integration

### Custom Icon Addition
```jsx
// Adding custom SVG icons
import { createIconComponent } from '../Common/icons';

const CustomIcon = createIconComponent((props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
  </svg>
));

// Usage
<Icon icon={CustomIcon} size={24} />
```

## 📊 Migration Impact Analysis

### Metrics to Track
- Bundle size before/after migration
- Page load performance
- Developer productivity metrics
- Icon rendering performance
- Accessibility score improvements

### Success Criteria
- ✅ 70%+ bundle size reduction
- ✅ No visual regressions
- ✅ Maintained/improved performance
- ✅ 100% feature parity
- ✅ Improved developer experience

## 🤝 Contributing

### Adding New Icons
1. Check if icon exists in Lucide React library
2. Add to appropriate category in `/src/components/Common/icons/index.ts`
3. Export with consistent naming convention
4. Update this documentation
5. Add to icon map for dynamic usage

### Reporting Issues
- Check existing GitHub issues
- Provide minimal reproduction case
- Include browser/environment details
- Tag with `icon-system` label

---

**Need Help?** Contact the frontend team or create an issue in the project repository.

**Performance Monitoring**: Icons are automatically tracked in our performance monitoring dashboard.

**A11y Compliance**: All icons include proper ARIA attributes and screen reader support.