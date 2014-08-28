function sampleAdmin() {
}

sampleAdmin.onStartup = function (cb) {

    // Add a new top level node
    pb.AdminNavigation.add({
        id: "sample",
        title: "Sample",
        icon: "cogs",
        href: "/admin/trees",
        access: ACCESS_USER,
        children: [
            {
                id: "sample_1",
                title: "Sample Child 1",
                icon: "cog",
                href: "/admin/sample/1",
                access: ACCESS_USER
            }
        ]
    });

    // Add a child to the top level node "sample"
    pb.AdminNavigation.addChild("sample", {
        id: "sample_2",
        title: "Sample Child 2",
        icon: "cog",
        href: "/admin/sample/2",
        access: ACCESS_USER
    });

    cb(null, true);
}

module.exports = sampleAdmin;