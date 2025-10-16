# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Environment Variables

The frontend application uses environment variables for configuration. Copy `.env.example` to `.env` and modify the values as needed:

```bash
cp .env.example .env
```

### Available Variables

- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:3001)
- `NODE_ENV`: Environment mode (development/production)

### Development Setup

1. Start the backend server on port 3001
2. Update `VITE_API_BASE_URL` in `.env` if using a different backend URL
3. Start the frontend development server

