Firmware for Freifunk Ulm
=========================

The firmware turns a common wireless router into a mesh networking device.
It connects to similar routers in the area and builds a Wifi-mesh network
but also opens an access point for computers to connect over Wifi.
Included is Internet connectivity and a web interface.

[Precompiled firmware images](https://map.freifunk-ulm.de/firmware/latest/ "Precompiled firmware images") are available on our server. All other released versions here on github are out-of-date.

To build the firmware yourself you need a Unix console to enter commands into.
Install dependencies for the build environment (Debian/Ubuntu):

```bash
    sudo apt-get update; sudo apt-get upgrade
    sudo apt-get install subversion g++ zlib1g-dev build-essential git python
    sudo apt-get install libncurses5-dev gawk gettext unzip file libssl-dev wget
```
Build commands for the console:

```bash
    git clone -b lede-17.01 git://git.lede-project.org/source.git
    cd source
    
    ./scripts/feeds update -a
    ./scripts/feeds install -a
    
    git clone https://github.com/ffulm/firmware.git
    cp -rf firmware/files firmware/package .
    git am --whitespace=nowarn firmware/patches/lede/*.patch
    cd feeds/routing && git am --whitespace=nowarn ../../firmware/patches/routing/*.patch && cd -
    rm -rf firmware tmp
    
    make defconfig
    make menuconfig
```
Now select the right "Target System" and "Target Profile" for your AP model:

For example, for the TL-WR841ND, select:
* `Target System => Atheros AR7xxx/AR9xxx`
* `Target Profile => TP-LINK TL-WR841ND`

Or in case you have the DIR-300, select:
* `Target System => <*> AR231x/AR5312`
* `Target Profile => <*> Default`

For other models you can lookup the "Target System" in the LEDE
[hardware table](https://lede-project.org/toh/start). Your AP model
should now be visible in the "Target Profile" list.

Now start the build process. This takes some time:

```bash
    make
```
*You have the oportunity to compile the firmware at more CPU Threats. 
E.g. for 4-Threats type* `make -j4` .

The **firmware images** are now in the `bin`-folder. Use the firmware update
functionality of your router and upload the factory image to flash it with the freifunk firmware. The sysupgrade
images are for further updates.

* Use `openwrt-[chip]-[model]-squashfs-factory.bin` for the initial flash.
* Use `openwrt-[chip]-[model]-squashfs-sysupgrade.bin` for futher updates.

**Many routers have not been tested yet, but may work.**
***Give it a try! :-)***
