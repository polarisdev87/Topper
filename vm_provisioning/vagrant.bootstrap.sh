 #!/usr/bin/env bash

export DEBIAN_FRONTEND=noninteractive

## Update and upgrade installed packages
apt-get update -y
apt-get upgrade -y

## Install nodesource repo to apt repolist
curl -sL https://deb.nodesource.com/setup_8.x | bash -

## Install packages
apt-get install --no-install-recommends -y \
    vim \
    git \
    nodejs

cd /vagrant

## Move node_modules outside of vagrant sync folder
rm -rf /vagrant/node_modules
mkdir -p /temp/vagrant/node_modules
chown -R vagrant:vagrant /temp/
sudo -u vagrant -H ln -snf /temp/vagrant/node_modules /vagrant/node_modules

## Install project nodejs dependencies
npm install --global gulp-cli
sudo -u vagrant -H npm install

## Build
sudo -u vagrant -H gulp
