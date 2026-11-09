// Perangkat uji utama (32-bit, kernel Linux 3.18 / Exynos 7870) crash pada Hermes,
// sedangkan skema app.json SDK 58 tidak lagi menerima jsEngine. Properti gradle
// hermesEnabled=false disetel lewat plugin konfigurasi saat prebuild agar mesin
// JavaScript kembali ke JSC seperti build v0.1.1 yang terbukti jalan.
const { withGradleProperties } = require('@expo/config-plugins');

function setJscEngine(props) {
  const existing = props.find((item) => item.type === 'property' && item.key === 'hermesEnabled');
  if (existing) {
    existing.value = 'false';
  } else {
    props.push({ type: 'property', key: 'hermesEnabled', value: 'false' });
  }
  return props;
}

module.exports = (config) =>
  withGradleProperties(config, (cfg) => {
    cfg.modResults = setJscEngine(cfg.modResults);
    return cfg;
  });
module.exports.setJscEngine = setJscEngine;
