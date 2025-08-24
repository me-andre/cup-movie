FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG SEARCH_DELAY
ARG API_ROOT_URL
ENV VITE_SEARCH_DELAY=$SEARCH_DELAY
ENV VITE_API_ROOT_URL=$API_ROOT_URL
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]