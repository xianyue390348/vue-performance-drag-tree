FROM node:14.18.2-alpine as node

RUN mkdir -p /app
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . /app
RUN yarn build

FROM nginx:1.16-alpine
COPY --from=node /app/dist/ /var/www/web/dist
ADD nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
