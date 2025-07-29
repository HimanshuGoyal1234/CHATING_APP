const searchInput = document.getElementById("searchInput");
const resultBox = document.getElementById("resultBox");

let userData = [];
module.exports = (req, res) => {
    // Step 1: Fetch JSON file
    fetch("../LOGIN/id_pass.json")
        .then(response => response.json())
        .then(data => {
            userData = data;
        })
        .catch(error => {
            console.error("Failed to load JSON:", error);
        });

    // Step 2: Search as user types
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        resultBox.innerHTML = "";

        if (query === "") return;

        const matches = userData.filter(user =>
            user.username.includes(query)
        );

        if (matches.length > 0) {
            resultBox.innerHTML = matches
                .map(user => `<div>✅ Found: <b>${ user.username }</b></div>`)
                .join("");
        } else {
            resultBox.innerHTML = "<div>❌ No match found</div>";
        }
    }
    )
};
