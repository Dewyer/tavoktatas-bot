FROM selenium/node-chrome
USER root
WORKDIR /
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g yarn

WORKDIR /usr/app/
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install
COPY . .
ENTRYPOINT [ "yarn","start" ]
