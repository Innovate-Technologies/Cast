ARG ARCHREPO
FROM ${ARCHREPO}/node:8

ARG QEMU_ARCH
COPY qemu-${QEMU_ARCH}-static /usr/bin/

RUN apt-get update && apt-get install -y ffmpeg

COPY ./ /opt/cast/
WORKDIR /opt/cast/

RUN npm install

CMD node server.js