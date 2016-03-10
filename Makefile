TARGET ?= armhf
ARCHS ?= amd64 armhf
BASE_ARCH ?= armhf


build: tmp-$(TARGET)/Dockerfile
	docker build --build-arg ARCH=$(TARGET) --no-cache -t innovatete.ch/docker:$(TARGET)-latest tmp-$(TARGET)
	docker run --rm multiarch-dockerfile:$(TARGET)-methodg uname -a
	docker run --rm multiarch-dockerfile:$(TARGET)-methodg ls -la /usr/bin/wget
	docker run --rm multiarch-dockerfile:$(TARGET)-methodg ls -la /overlay


tmp-$(TARGET)/Dockerfile: Dockerfile $(shell find overlay-common overlay-$(TARGET))
	rm -rf tmp-$(TARGET)
	mkdir tmp-$(TARGET)
	cp Dockerfile $@
	cp -rf overlay-common tmp-$(TARGET)/
	cp -rf overlay-$(TARGET) tmp-$(TARGET)/
	for arch in $(ARCHS); do                     \
	  if [ "$$arch" != "$(TARGET)" ]; then       \
	    sed -i "/arch=$$arch/d" $@;              \
	  fi;                                        \
	done
	sed -i '/#[[:space:]]*arch=$(TARGET)/s/^#//' $@
	sed -i 's/#[[:space:]]*arch=$(TARGET)//g' $@
	cat $@
