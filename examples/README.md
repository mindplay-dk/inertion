To run these examples, first create a local copy of the package - from the root
folder of the project, run the `npm pack` command to create a packed copy:

    npm run pack --pack-destination examples

A packed `.tgz` file will land in the examples folder.

Now, from e.g. the `examples/basic` folder, install the package:

    npm install ../inertion-0.1.0.tgz
