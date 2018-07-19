ARG ARCHREPO
FROM ${ARCHREPO}/node:10-stretch

ARG QEMU_ARCH
COPY qemu-${QEMU_ARCH}-static /usr/bin/

COPY ./ /opt/cast/
WORKDIR /opt/cast/

RUN npm install

CMD node server.js
