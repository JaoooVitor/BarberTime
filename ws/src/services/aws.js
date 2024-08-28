const AWS = require('aws-sdk');

// Configuração do AWS SDK
AWS.config.update({
  accessKeyId: 'AKIATQZCSVTD3TZ73CIM',
  secretAccessKey: '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',
  region: 'us-east-2',
});

const s3 = new AWS.S3();

module.exports = {
  BUCKET_NAME: 'barber-time',

  uploadToS3: function (file, filename) {
    return new Promise((resolve, reject) => {
      if (!Buffer.isBuffer(file)) {
        return reject({ error: true, message: 'O arquivo deve ser um Buffer.' });
      }

      const params = {
        Bucket: this.BUCKET_NAME,
        Key: filename,
        Body: file, // Certifique-se de que isso é um Buffer
        // Removido ACL
      };

      s3.upload(params, (err, data) => {
        if (err) {
          console.error(err);
          return reject({ error: true, message: err.message });
        }
        console.log(data);
        return resolve({ error: false, message: data });
      });
    });
  },

  deleteFileS3: function (key) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.BUCKET_NAME,
        Key: key,
      };

      s3.deleteObject(params, (err, data) => {
        if (err) {
          console.error(err);
          return reject({ error: true, message: err.message });
        }
        console.log(data);
        return resolve({ error: false, message: data });
      });
    });
  },
};
