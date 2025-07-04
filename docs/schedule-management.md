# Schedule Management System

## Overview

The Schedule Management System allows administrators to efficiently manage course schedules through multiple import methods and provides comprehensive viewing and editing capabilities.

## Features

### 1. Bulk Import Capabilities

#### CSV Import
- **Format**: Upload CSV files with course schedules
- **Required Headers**: `CourseCode`, `Day`, `StartTime`, `EndTime`, `Venue`
- **Validation**: Automatic validation of course codes, time formats, and venue information
- **Template**: Downloadable CSV template available

#### PDF Import
- **Limited Support**: Basic PDF text extraction
- **Recommendation**: Use CSV format for bulk imports
- **Future Enhancement**: Full PDF parsing with OCR capabilities

#### Manual Entry
- **Individual Entry**: Add schedules one by one through a user-friendly interface
- **Real-time Validation**: Immediate feedback on form errors
- **Course Selection**: Dropdown selection from existing courses

### 2. Schedule Management Interface

#### List View
- **Comprehensive Table**: Shows all schedules with course details, times, venues, and lecturers
- **Search & Filter**: Filter by faculty, department, day, or search terms
- **Actions**: Edit and delete individual schedules
- **Sorting**: Sort by various criteria

#### Timetable View
- **Visual Grid**: Weekly timetable showing all schedules in a grid format
- **Time Slots**: Organized by hour slots (8:00 AM - 5:00 PM)
- **Day Columns**: Monday through Friday
- **Course Information**: Displays course code, title, times, and venue

#### Overview Dashboard
- **Statistics**: Total schedules, active courses, and lecturers
- **Distribution Chart**: Visual representation of schedule distribution by day
- **Quick Insights**: Overview of system usage

### 3. Export Functionality

#### CSV Export
- **Complete Data**: Exports all schedule information including course and lecturer details
- **Formatted Output**: Properly formatted CSV with headers
- **Date Stamping**: Automatic filename with current date

## API Endpoints

### Bulk Import
```
POST /api/admin/schedules/bulk
```
- **Purpose**: Import multiple schedules from CSV or manual entry
- **Authentication**: Admin only
- **Validation**: Duplicate checking and course validation
- **Response**: Import statistics and error details

### Individual Schedule Operations
```
PUT /api/admin/schedules/[id]
DELETE /api/admin/schedules/[id]
```
- **Purpose**: Update or delete individual schedules
- **Authentication**: Admin only
- **Validation**: Duplicate checking and data validation

### Export
```
GET /api/admin/schedules/export
```
- **Purpose**: Export all schedules to CSV format
- **Authentication**: Admin only
- **Response**: CSV file download

## CSV Format Specification

### Required Headers
```csv
CourseCode,Day,StartTime,EndTime,Venue
```

### Data Format
- **CourseCode**: Must match existing course codes in the system
- **Day**: Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday
- **StartTime**: Format HH:MM (24-hour format)
- **EndTime**: Format HH:MM (24-hour format)
- **Venue**: Any text string

### Example
```csv
CourseCode,Day,StartTime,EndTime,Venue
CSC 101,Monday,09:00,10:00,LT1
MAT 101,Tuesday,10:00,11:00,LT2
PHY 101,Wednesday,11:00,12:00,LT3
```

## Validation Rules

### Course Code
- Must exist in the system
- Case-insensitive matching
- Exact match required

### Time Format
- Must be in HH:MM format (24-hour)
- End time must be after start time
- Valid time range: 00:00 to 23:59

### Day Format
- Must be one of the predefined days
- Case-sensitive matching
- Full day names required

### Venue
- Required field
- No specific format restrictions
- Maximum length: 255 characters

## Error Handling

### Import Errors
- **Invalid Course**: Course code not found in system
- **Invalid Time**: Incorrect time format or logic
- **Invalid Day**: Day not in allowed list
- **Missing Venue**: Venue field is empty
- **Duplicate Schedule**: Same course, day, and time combination

### User Feedback
- **Success Messages**: Clear confirmation of successful operations
- **Error Details**: Specific error messages for each validation failure
- **Progress Indicators**: Loading states during operations
- **Preview Mode**: Review data before final import

## Security Features

### Authentication
- Admin-only access to all schedule management features
- Session-based authentication
- Role-based access control

### Data Validation
- Server-side validation for all inputs
- SQL injection prevention
- XSS protection

### Audit Logging
- All schedule operations are logged
- User tracking for accountability
- Operation details stored for audit trails

## Usage Instructions

### For Administrators

1. **Access Schedule Management**
   - Navigate to Admin Dashboard
   - Click on "Schedules" in the navigation menu

2. **Import Schedules**
   - Click "Import Schedules" button
   - Choose import method (CSV, PDF, or Manual)
   - Follow the guided process
   - Review preview before final import

3. **Manage Existing Schedules**
   - Use filters to find specific schedules
   - Edit individual schedules using the edit button
   - Delete schedules using the delete button
   - Export all schedules to CSV

4. **View Schedules**
   - Switch between List, Timetable, and Overview views
   - Use search and filter options
   - Navigate through different time periods

### Best Practices

1. **CSV Import**
   - Use the provided template
   - Validate data before import
   - Check for duplicates
   - Test with small batches first

2. **Data Management**
   - Regular backups of schedule data
   - Validate imported data
   - Monitor for conflicts
   - Keep course codes consistent

3. **User Training**
   - Provide training on CSV format
   - Document common errors
   - Create user guides
   - Offer support for complex imports

## Future Enhancements

### Planned Features
- **Advanced PDF Parsing**: Full OCR support for PDF timetables
- **Conflict Detection**: Automatic detection of schedule conflicts
- **Room Management**: Integration with room booking system
- **Recurring Schedules**: Support for recurring schedule patterns
- **Mobile App**: Mobile interface for schedule management

### Technical Improvements
- **Performance Optimization**: Faster import processing
- **Real-time Updates**: Live schedule updates
- **API Enhancements**: RESTful API for external integrations
- **Data Analytics**: Advanced reporting and analytics

## Troubleshooting

### Common Issues

1. **Import Failures**
   - Check CSV format and headers
   - Verify course codes exist
   - Ensure time format is correct
   - Check for duplicate entries

2. **Display Issues**
   - Clear browser cache
   - Check for JavaScript errors
   - Verify user permissions
   - Refresh the page

3. **Performance Issues**
   - Reduce batch size for large imports
   - Check server resources
   - Optimize database queries
   - Monitor system logs

### Support

For technical support or questions about the Schedule Management System, please contact the system administrator or refer to the system documentation. 