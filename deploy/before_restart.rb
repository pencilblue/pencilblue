node[:deploy].each do |application, deploy|
  if application.to_s == 'tecpencilblue'

    release_dir  = ::File.expand_path(__FILE__).sub('deploy/before_restart.rb', '')
    user, group  = deploy[:user], deploy[:group]

    Chef::Log.info("Renaming pencilblue.js to server.js")
    pencilblue_file = ::File.join(release_dir, 'pencilblue.js')

    server_file = ::File.join(release_dir, 'server.js')

    file server_file do
      action :delete
    end

    file server_file do
      owner user
      group group
      mode 00755
      content ::File.open(pencilblue_file).read
      action :create
    end

    file pencilblue_file do
      action :delete
    end

    Chef::Log.info("Importing config.json for application: #{application}")
    config_json = deploy[:config_json].to_s.gsub('=>', ':')
    Chef::Log.info("release_dir: #{release_dir}")

    config_file = ::File.join(release_dir, 'config.json')
    Chef::Log.info("config.json path: #{config_file}")

    file config_file do
      action :delete
    end
    Chef::Log.info("#{config_file} deleted")

    file config_file do
      owner user
      group group
      mode 00755
      content config_json
      action :create
    end
    Chef::Log.info("#{config_file} created")
    
    execute "npm install -g bower" do
        cwd release_dir
    end
      
    execute "bower install" do
        command "bower install --allow-root"
        cwd "#{deploy[:deploy_to]}/current"
    end
  
    Chef::Log.info("Killing java process that is AppDynamics agent")
    execute "Stopping AppDynamics Agent" do
        command "killall java"
        returns [0,1]
    end
  
    Chef::Log.info("Executing chmod -R a+rw /tmp/appd")
    execute "chmod appd logs" do
      command "sudo chmod -R a+rw /tmp/appd"
      only_if { ::File.exists?("/tmp/appd") }
    end
  end
end
