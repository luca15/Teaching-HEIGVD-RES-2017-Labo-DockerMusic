FROM node:6.10.2
MAINTAINER Luca Sivillica <luca.sivillica@heig-vd.ch>

#
# When we build the image, we copy the executable js in the image file system.
#
COPY src /opt/app/

WORKDIR /opt/app/
RUN npm install

ENTRYPOINT ["node", "/opt/app/auditor.js"]
