ARG ARCHREPO
FROM ${ARCHREPO}/node:8

ARG QEMU_ARCH
COPY qemu-${QEMU_ARCH}-static /usr/bin/

COPY ./ /opt/cast/
WORKDIR /opt/cast/

RUN npm install

CMD node server.js