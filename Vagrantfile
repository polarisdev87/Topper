Vagrant.configure("2") do |config|
    config.vm.box = "ubuntu/xenial64"
    config.vm.box_version = "20190308.0.0"
    config.vm.define "Topperoo" do |t|
    end

    config.vm.network "forwarded_port", guest: 3000, host: 3000
    config.vm.provision :shell, path: "vm_provisioning/vagrant.bootstrap.sh"

    config.vm.provider "virtualbox" do |v|
      v.memory = 512
      v.cpus = 1
    end
end
