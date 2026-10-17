# 📚 Resource Hub & Download System - Minimal Design Guide

## Overview

The **Resource Hub** is a clean, minimal component for managing files and links within study groups. It provides a streamlined interface for uploading files, adding links, searching, filtering, and downloading resources.

## 🎯 Design Principles

### 1. **Minimal & Focused**
- Single-purpose component: manage resources only
- No distracting UI elements
- Clean typography hierarchy
- Whitespace-first design

### 2. **Fast Access**
- One-click upload/add buttons
- Instant search and filtering
- Icon-based actions (visual recognition)
- No unnecessary modals

### 3. **Information Hierarchy**
```
Title (Most Important)
├─ Description (Secondary)
├─ Tags (Categorization)
└─ Actions (Download/Delete)
```

### 4. **Responsive**
- Mobile-first design
- Flexible grid layout (1→2→3 columns)
- Touch-friendly button sizes (44px+ targets)

---

## 📐 Component Structure

```
ResourceHub/
├─ Header
│  ├─ Title "Resources"
│  └─ Upload Button (Primary CTA)
│
├─ Toolbar
│  ├─ Search Input
│  └─ Tag Filter Dropdown
│
├─ Content Grid
│  └─ Resource Cards (Responsive)
│     ├─ Icon (File type)
│     ├─ Title + Description
│     ├─ Tags
│     └─ Actions (Download/Delete)
│
└─ Upload Modal
   ├─ Type Selector (File/Link)
   ├─ Form Fields
   │  ├─ Title (Required)
   │  ├─ File/URL (Required)
   │  ├─ Tags (Optional)
   │  └─ Description (Optional)
   └─ Submit Actions
```

---

## 🎨 Visual Design

### Color Scheme
- **Primary Action**: Indigo (#4F46E5)
- **Backgrounds**: White (#FFFFFF), Slate-50 (#F8FAFC)
- **Borders**: Slate-200 (#E2E8F0)
- **Text**: Slate-900 (#0F172A), Slate-600 (#475569)
- **Danger**: Red (#DC2626)

### Typography
- **Titles**: 14px, 700 weight (Semibold)
- **Body**: 14px, 500 weight (Medium)
- **Meta**: 12px, 400 weight (Regular)
- **Labels**: 12px, 600 weight (Semibold)

### Spacing
- **Card Padding**: 1rem (16px)
- **Grid Gap**: 1rem (16px)
- **Form Gap**: 1rem (16px)
- **Element Gap**: 0.5rem (8px)

### Border Radius
- **Cards**: 0.5rem (8px)
- **Buttons**: 0.5rem (8px)
- **Inputs**: 0.5rem (8px)
- **Modal**: 0.75rem (12px)

---

## 🎯 Key Features

### 1. Upload File
```jsx
<button onClick={() => setResourceType('file'); setShowModal(true)}>
  📤 Upload
</button>
```
- Single file selection
- Pre-configured file types (.pdf, .doc, .xls, etc.)
- Drag-and-drop ready (can be extended)

### 2. Add Link
```jsx
<input type="url" placeholder="https://example.com" />
```
- Auto-prefix https:// if needed
- OpenGraph preview support (optional enhancement)

### 3. Search & Filter
```jsx
// Real-time search
<input onChange={(e) => setSearchQuery(e.target.value)} />

// Tag-based filtering
<select onChange={(e) => setFilterTag(e.target.value)}>
  {allTags.map(tag => <option>{tag}</option>)}
</select>
```

### 4. Smart Icons
```javascript
Function getFileIcon(ext):
  .pdf → Red file icon
  .doc/.docx → Blue file icon
  .xls/.xlsx → Green file icon
  .ppt/.pptx → Orange file icon
  .zip/.rar → Purple file icon
  Default → Gray file icon
```

### 5. Resource Card
```
┌─────────────────────────────────┐
│ [Icon] Title                [x] │  ← Header with delete
├─────────────────────────────────┤
│ Optional description text       │
├─────────────────────────────────┤
│ [tag1] [tag2] [tag3]            │  ← Tags as badges
├─────────────────────────────────┤
│ File | [↓] [🔗] [✕]             │  ← Actions (type-specific)
└─────────────────────────────────┘
```

---

## 🚀 Usage

### In GroupDetail Component
```jsx
<ResourceHub 
  groupId={groupId}
  isAdmin={isAdmin}
  currentUserId={userId}
  resources={resources}
  onUpdate={refreshData}
/>
```

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `groupId` | String | ✓ | The group ID for API requests |
| `isAdmin` | Boolean | ✓ | Show delete button only for admins/creators |
| `currentUserId` | String | ✓ | Current user ID for permission checks |
| `resources` | Array | ✓ | Array of resource objects |
| `onUpdate` | Function | ✗ | Callback to refresh data after changes |

### Resource Object Structure
```javascript
{
  _id: String,
  title: String,              // "Lecture Notes - Week 5"
  description: String,        // "Chapter 1-3 summary"
  type: String,              // "file" or "link"
  url: String,               // File path or URL
  tags: Array<String>,       // ["notes", "important"]
  uploadedBy: {
    _id: String,
    name: String
  },
  createdAt: Date
}
```

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width input fields
- Stack buttons vertically
- Touch-friendly padding

### Tablet (768px - 1024px)
- 2-column grid
- Inline buttons
- Horizontal layout

### Desktop (> 1024px)
- 3-column grid
- Optimal spacing
- Full feature visibility

---

## ♿ Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter key to submit forms
- Space key for buttons

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Icon buttons have visible focus states
- Hover states clearly indicate interactivity

### Screen Readers
- Semantic HTML elements
- Meaningful button labels
- Title attributes on icon buttons

### Aria Labels
```jsx
<button aria-label="Download resource">
  <Download size={16} />
</button>
```

---

## 📦 File Size Handling

### Backend Validation
- Max file size: 10MB
- Allowed types:
  - Documents: .pdf, .doc, .docx
  - Spreadsheets: .xls, .xlsx
  - Presentations: .ppt, .pptx
  - Images: .jpg, .jpeg, .png, .gif
  - Data: .txt, .csv, .zip

### Frontend Warning (Optional)
```javascript
if (file.size > 10 * 1024 * 1024) {
  toast.error("File size must be under 10MB");
}
```

---

## 🔐 Permissions

### Who Can Upload
- Any group member
- File counts toward contribution score (+5 points for file, +3 for link)

### Who Can Delete
- Resource creator
- Group admin/creator

### Who Can Download/View
- All group members (shared)
- Public if link shared externally

---

## 🎨 CSS Classes Used

### Utility Classes (Tailwind)
```css
/* Cards */
.bg-white .rounded-lg .border .p-4 .hover:shadow-md

/* Buttons */
.px-4 .py-2 .rounded-lg .font-medium .transition-colors

/* Typography */
.font-semibold .text-slate-900 .line-clamp-2

/* State */
.hover:text-indigo-600 .hover:bg-indigo-50 .focus:ring-2
```

---

## 🔄 Data Flow

```
User Action
    ↓
ResourceHub Component
    ↓
API Call (/groups/:id/resources)
    ↓
Backend Processing
    ↓
Response
    ↓
State Update + Toast
    ↓
onUpdate() Callback
    ↓
Parent Refresh
```

---

## 🚨 Error Handling

### Upload Validation
```javascript
if (!form.title.trim()) → "Title is required"
if (!form.file && type==="file") → "Please select a file"
if (!form.url && type==="link") → "URL is required"
if (error.response?.data?.message) → Show API error
```

### User Feedback
```javascript
toast.success("Resource uploaded successfully!")
toast.error("Failed to save resource")
toast.loading("Saving...")
```

---

## 🎯 Best Practices Implemented

✅ **Single Responsibility**: Only manages resources
✅ **Mobile First**: Responsive from small screens
✅ **Performance**: Minimal re-renders, efficient filtering
✅ **Accessibility**: WCAG compliant
✅ **Error Handling**: Graceful failures with user feedback
✅ **Type Safety**: Clear prop documentation
✅ **Separation of Concerns**: Upload logic isolated
✅ **Reusability**: Can be dropped into any group context

---

## 🔮 Future Enhancements

### Optional Additions
- Drag-and-drop file upload
- Preview thumbnails
- Advanced search (size, date range)
- Bulk operations (select multiple)
- Resource categories/folders
- Version history
- Comments on resources
- Share link generation
- Download analytics

### Performance Optimizations
- Virtual scrolling for large lists
- Image compression
- CDN file serving
- Lazy loading thumbnails
- Cache mechanism

---

## 📝 Example Usage

```jsx
import ResourceHub from '@/components/ResourceHub';

export default function GroupPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadResources = async () => {
    setLoading(true);
    const res = await api.get(`/groups/${groupId}/resources`);
    setResources(res.data.data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <ResourceHub
        groupId={groupId}
        isAdmin={userRole === 'admin'}
        currentUserId={userId}
        resources={resources}
        onUpdate={loadResources}
      />
    </div>
  );
}
```

---

## 🎓 Summary

The **Resource Hub** achieves minimal design through:
1. **Focused scope** - Resources only
2. **Clean UI** - Whitespace, clear hierarchy
3. **Fast interactions** - Search, filter, single-click actions
4. **Responsive layout** - Works on all devices
5. **Accessible** - WCAG compliant navigation
6. **Maintainable** - Documented, reusable component

Perfect for collaborative study environments! 📚
