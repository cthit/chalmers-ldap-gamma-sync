use clokwerk::{Job, Scheduler, TimeUnits};
use ldap3::{LdapConn, Scope, SearchEntry};
use std::{env, error::Error};
use ureq::serde_json::json;

fn main() {
    let key_id = env::var("GAMMA_API_KEY_ID").expect("GAMMA_API_KEY_ID");
    let key_secret = env::var("GAMMA_API_KEY_SECRET").expect("GAMMA_API_KEY_SECRET");
    let ldap_cn = env::var("LDAP_COMMON_NAME").expect("LDAP_COMMON_NAME");
    let api_key = format!("pre-shared {}:{}", key_id, key_secret);

    try_sync(&api_key, &ldap_cn);

    let mut scheduler = Scheduler::new();
    scheduler.every(1.day()).at("12:00 am").run(move || {
        try_sync(&api_key, &ldap_cn);
    });

    loop {
        scheduler.run_pending();
        std::thread::sleep(std::time::Duration::from_secs(60));
    }
}

fn try_sync(api_key: &String, ldap_cn: &String) {
    sync(api_key, ldap_cn).unwrap_or_else(|e| {
        println!("Sync failed: {}", e);
    });
}

fn sync(api_key: &String, ldap_cn: &String) -> Result<(), Box<dyn Error>> {
    println!("Sync started - connecting to LDAP...");
    let mut ldap = LdapConn::new("ldap://ldap.chalmers.se")?;
    let (rs, _res) = ldap
        .search(
            "ou=groups,dc=chalmers,dc=se",
            Scope::Subtree,
            &format!("(cn={})", ldap_cn),
            vec!["memberUid"],
        )?
        .success()?;

    let cids_to_add: Vec<String> = rs
        .into_iter()
        .filter_map(|x| SearchEntry::construct(x).attrs.get("memberUid").cloned())
        .flatten()
        .collect();
    let cids_count = cids_to_add.len();

    if cids_count == 0 {
        println!("No CIDs found");
        return Ok(ldap.unbind()?);
    }

    println!("Found {} CIDs that will be added:", cids_count);
    println!("{:?}", cids_to_add);
    println!("\nAdding CIDs...");

    let res = ureq::post("https://auth.chalmers.it/api/allow-list/v1")
        .set("Authorization", api_key)
        .set("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(10))
        .send_json(json!({
            "cids": cids_to_add,
        }))?;

    let failed_cids = match res.status() {
        200 => vec![],
        206 => res.into_json::<Vec<String>>().unwrap_or(cids_to_add),
        status => {
            println!("Server responded with unexpected status {}", status);
            cids_to_add
        }
    };

    let failed_count = cids_count - failed_cids.len();
    println!("\nAdded {} out of {} CIDs", failed_count, cids_count);
    if !failed_cids.is_empty() {
        println!("The following CIDs failed to add:\n{:?}", failed_cids);
    }

    Ok(ldap.unbind()?)
}
