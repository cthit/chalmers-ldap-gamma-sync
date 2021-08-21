# chalmers-ldap-gamma-sync

Sync users from chalmers ldap (ldap.chalmers.se) to gamma, adding them to the whitelist so that enrolled students can create accounts in gamma.

## Usage

The script requires two environment variables, `CHALMERS_GROUP` and `GAMMA_API_KEY`. Normally the group should be `s_passer_prog_tkite`, but new students are not added to this group before the semester starts, but are temporarily added to a group named something along the lines of `s_studier_forvantade_programdeltagare_chalmers_tkite_h21`, but will vary year to year. A `GAMMA_API_KEY` can be created in gamma if you're an admin.

Example:

```sh
$ GAMMA_API_KEY=xxxxx CHALMERS_GROUP=s_passer_prog_tkite node index.js
```
