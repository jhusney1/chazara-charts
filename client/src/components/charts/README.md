# Chart Components Architecture

This directory contains modular components for different types of chart generators in the Chazara Charts application.

## Overview

The chart system is designed to be extensible, allowing for easy addition of new chart types with their specific options and behaviors while sharing common UI components and functionality.

## Components

### Base Components

- `BaseChartForm.js` - Contains reusable UI components and utility functions:
  - `Tooltip` - For displaying additional information about form fields
  - `FormatSelection` - For choosing between Excel and PDF formats
  - `GenerateButton` - The submission button with loading state
  - `downloadChart` - Utility function for downloading generated charts

### Chart Types

- `GemaraChartForm.js` - For generating Talmud study charts
- `MishnayotChartForm.js` - For generating Mishnayot study charts (placeholder)
- `MishnaBeruraChartForm.js` - For generating Mishna Berura study charts (placeholder)

### Support Files

- `index.js` - Export file for all chart components, making imports cleaner

## How to Add a New Chart Type

1. **Create a new component file**: Create a new component file in this directory (e.g., `NewChartForm.js`)

2. **Import common components**: Import the common components from BaseChartForm
   ```javascript
   import { Tooltip, FormatSelection, GenerateButton, downloadChart } from './BaseChartForm';
   ```

3. **Implement your chart-specific form**: Create your form with chart-specific options

4. **Use common components**: Utilize the common components for consistent UI
   ```javascript
   <FormatSelection format={formData.format} onChange={handleChange} labels={labels} />
   <GenerateButton loading={loading} generatingText={t.generating} generateText={t.generate} />
   ```

5. **Add to index.js**: Export your new component in `index.js`
   ```javascript
   import NewChartForm from './NewChartForm';
   export { NewChartForm };
   ```

6. **Update the main ChartForm component**: Add your new chart type to the CHART_TYPES object and include it in the renderChartForm switch statement

## Backend Integration

When creating a new chart type, you may need to add corresponding API endpoints in the server to handle the specific requirements of your chart type.

## Styling

All chart forms follow a consistent styling approach with:
- Gradient headers
- Card-based sections
- Consistent form elements
- Responsive layouts

Each chart type can have its own accent color scheme while maintaining the overall design language. 