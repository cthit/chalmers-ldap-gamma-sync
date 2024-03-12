# chalmers-ldap-gamma-sync

Sync users from chalmers ldap (ldap.chalmers.se) to Gamma, adding them to the whitelist so that enrolled students can create accounts in Gamma.

## Usage

The script requires three environment variables - `GAMMA_API_KEY_ID`, `GAMMA_API_KEY_SECRET`, and `LDAP_COMMON_NAME`.
Normally the group should be `s_passer_prog_tkite`, but new students are not added to this group before the semester starts, but are temporarily added to a group named something along the lines of `s_studier_forvantade_programdeltagare_chalmers_tkite_h21`, but will vary year to year.
An API key can be created in Gamma if you're an admin.

Example:

```sh
$ GAMMA_API_KEY_ID=xxxxx GAMMA_API_KEY_SECRET=xxxxx LDAP_COMMON_NAME=s_passer_prog_tkite cargo run --release
```
