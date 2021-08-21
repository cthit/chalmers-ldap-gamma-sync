const axios = require("axios");
const ldap = require("ldap");

const client = ldap.createClient({
	url: "ldap://ldap.chalmers.se",
});

// Den vanliga gruppen
let group = "s_passer_prog_tkite";

// Gruppen för folk som inte börjat, lär behöva ändra h21 till aktuellt år, dvs h22 etc.
// let group = "s_studier_forvantade_programdeltagare_chalmers_tkite_h21";

(async function () {
	let cids = await new Promise((resolve, reject) => {
		client.search(
			"ou=groups,dc=chalmers,dc=se",
			{
				filter: "cn=" + group,
				scope: "sub",
			},
			(err, res) => {
				if (err) {
					reject(err);
				}

				res.on("searchEntry", (entry) => {
					resolve(entry.object.memberUid);
				});
			}
		);
	});
	console.log(cids);

	// Lägg till dem en och en eftersom att det krashar annars
	cids.forEach((cid) => {
		axios({
			method: "POST",
			url: "https://gamma.chalmers.it/api/admin/users/whitelist",
			data: {
				cids: [cid],
			},
			headers: {
				Authorization: "pre-shared " + process.env.GAMMA_API_KEY,
				"Content-Type": "application/json",
			},
		})
			.then(() => console.log("Added: ", cid))
			.catch(() => console.log("Could not add: ", cid));
	});

	process.exit(0);
})();
