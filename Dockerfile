ARG ARCHREPO
FROM ${ARCHREPO}/node:10-stretch

ARG QEMU_ARCH
COPY qemu-${QEMU_ARCH}-static /usr/bin/

RUN apt-get update && apt-get install -y ffmpeg libogg-dev

COPY ./ /opt/cast/
WORKDIR /opt/cast/

RUN npm install

CMD node server.js
