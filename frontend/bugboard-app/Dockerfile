FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN sed -i "s|http://127.0.0.1:8000/api|${API_URL:-http://localhost:8000/api}|g" src/environments/environment.ts
RUN npm run build -- --configuration production

FROM nginx:alpine

COPY --from=build /app/dist/bugboard-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
