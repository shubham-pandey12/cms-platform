FROM node:22-alpine AS frontend-deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS frontend-builder
WORKDIR /workspace
COPY frontend frontend
COPY widgets widgets
COPY --from=frontend-deps /app/node_modules frontend/node_modules
WORKDIR /workspace/frontend
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ARG NEXT_PUBLIC_MOS_GATEWAY_URL
ENV NEXT_PUBLIC_MOS_GATEWAY_URL=${NEXT_PUBLIC_MOS_GATEWAY_URL}
ARG NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID
ENV NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID=${NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID}
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /workspace/frontend/public
RUN npx next build

FROM node:22-alpine AS frontend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=frontend-builder /workspace/frontend/public ./public
COPY --from=frontend-builder --chown=nextjs:nodejs /workspace/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /workspace/frontend/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]