const { exec } = require("child_process");

module.exports = async () => {
  return new Promise((resolve, reject) => {
    exec("npm run cleanup:k3d", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve();
    });
  });
};
