# GridCore.js

> Lightweight JavaScript data grid library for enterprise applications

## 🎯 Features

- ✅ Sorting & Pagination
- ✅ Responsive Design
- ✅ CSRF Token Support
- ✅ Debug Mode
- 🚧 Excel Download (Coming Soon)
- 🚧 Clipboard Copy (Coming Soon)

## 🚀 Quick Start

### Basic Usage

\```html
const grid = new GridCore({
    selector: 'myGrid',
    url: '/api/data',
    columns: [
        { label: 'Year', field: 'year', sortField: 'YEAR' },
        { label: 'Project', field: 'project', sortField: 'PROJECT' }
    ],
    title: 'Project List',
    pageSizeList: [10, 20, 50, 100],
    debug: true
});
</script>
\```

## 📖 Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `selector` | string | O | Container element ID |
| `url` | string | O | API endpoint URL |
| `columns` | array | O | Column definitions |
| `title` | string | X | Grid title (default: "목록") |
| `pageSizeList` | array | X | Page size options |
| `pageMode` | number | X | 0: prev/next, 1: first/last |
| `param` | object | X | Additional parameters |
| `debug` | boolean | X | Debug mode (default: false) |

## 🛠️ Column Options

\```javascript
{
    label: 'Column Title',     // Required
    field: 'dataFieldName',    // Required
    sortField: 'DB_COLUMN',    // Optional
    align: 'tc',               // Optional: 'tl', 'tc', 'tr'
    width: '100px'             // Optional: default 'auto'
}
\```

## 💡 Server Response Format

\```json
{
    "result": "success",
    "totalCount": 100,
    "list": [
        {"year": "2024", "project": "Sample A"},
        {"year": "2024", "project": "Sample B"}
    ]
}
\```

## 🎨 Dependencies

- jQuery 3.4.1+

## 📄 License

MIT License

## 👤 Author

**Your Name**
- GitHub: [@yourname](https://github.com/yourname)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
