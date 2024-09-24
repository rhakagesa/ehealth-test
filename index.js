const axios = require("axios");

async function getData(url) {
  const results = [];

  while (url) {
    const response = await axios.get(url);

    results.push(...response.data.entry);
    const nextLink = response.data.link.find(
      (link) => link.relation === "next"
    );
    url = nextLink ? nextLink.url : null;
  }
  return results;
}

async function main() {
  try {
    const countCode = {};
    const result = await getData(
      "https://api.staging.ehealth.id/fhir/Composition/?date=ge2024-04-01&date=le2024-04-30"
    );
    if (result) {
      const promises = [];

      result.map((obj) => {
        const resource = obj.resource?.section || [];

        const titleAssessmentDiagnosis = resource.filter(
          (item) => item.title === "Assessment/Diagnosis"
        );

        titleAssessmentDiagnosis.map((obj) => {
          const entry = obj?.entry || [];

          entry.map((ref) => {
            const promise = axios
              .get("https://api.staging.ehealth.id/fhir/" + ref.reference)
              .then((result) => {
                const resCode = result.data.code?.coding || [];
                if (resCode) {
                  resCode.map((coding) => {
                    const code = coding.code;
                    if (countCode[code]) {
                      countCode[code] += 1;
                    } else {
                      countCode[code] = 1;
                    }
                  });
                }
              });
            promises.push(promise);
          });
        });
      });
      await Promise.all(promises);

      console.log(countCode);
    }
  } catch (error) {
    console.log(error);
  }
}

main();
