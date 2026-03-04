const domains = {
  "dotryder.com": {
    ftpHost: process.env.DOTRYDER_FTP_HOST,
    ftpUser: process.env.DOTRYDER_FTP_USER,
    ftpPassword: process.env.DOTRYDER_FTP_PASSWORD,
    uploadPath: "/",
    publicBaseUrl: "https://dotryder.com/uploads",
  },
  "dotryder.in": {
    ftpHost: process.env.DOTRYDERIN_FTP_HOST,
    ftpUser: process.env.DOTRYDERIN_FTP_USER,
    ftpPassword: process.env.DOTRYDERIN_FTP_PASSWORD,
    uploadPath: "/",
    publicBaseUrl: "https://dotryder.in/uploads",
  },
  // Add more domains here:
  // "anotherdomain.com": {
  //   ftpHost: process.env.ANOTHER_FTP_HOST,
  //   ftpUser: process.env.ANOTHER_FTP_USER,
  //   ftpPassword: process.env.ANOTHER_FTP_PASSWORD,
  //   uploadPath: "/public_html/uploads",
  //   publicBaseUrl: "https://anotherdomain.com/uploads",
  // },
};

const LOCAL_TEST_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function getDefaultDomain() {
  return Object.keys(domains)[0] || null;
}

function isLocalTestHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getDomainConfig(origin) {
  if (!origin) return null;
  try {
    const hostname = new URL(origin).hostname;
    if (domains[hostname]) {
      return { ...domains[hostname], domain: hostname };
    }

    // In local testing, map localhost origins to the first configured domain.
    if (process.env.NODE_ENV !== "production" && isLocalTestHostname(hostname)) {
      const fallbackDomain = getDefaultDomain();
      if (fallbackDomain && domains[fallbackDomain]) {
        return { ...domains[fallbackDomain], domain: fallbackDomain };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getAllowedOrigins() {
  const configuredDomains = Object.keys(domains).map((d) => `https://${d}`);
  if (process.env.NODE_ENV === "production") {
    return configuredDomains;
  }
  return [...configuredDomains, ...LOCAL_TEST_ORIGINS];
}

module.exports = { domains, getDomainConfig, getAllowedOrigins };
