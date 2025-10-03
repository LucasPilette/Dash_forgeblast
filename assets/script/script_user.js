
// Récupère l’id dans l’URL
function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

const userId = getUserIdFromUrl();
if (userId) {
  fetch(`http://127.0.0.1:3100/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      'x-api-key': 'fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b',
    }
  })
    .then(res => res.json())
    .then(user => {
      if (user.error) {
        // Affiche une erreur si besoin
        document.querySelector(".userContent").innerHTML += `<p style="color:red;">${user.error}</p>`;
      } else {
        // Affiche les infos de l'utilisateur (exemple)
        const userContent = document.querySelector(".userContent");
        userContent.innerHTML += `
          <div class="userInfos">
          <div><h2>${user.name}</h2></div>
          <div><p>blast ID: ${user.blastId}</p></div>
          <div><p>Email: ${user.email}</p></div>
          <div><p>Status: ${user.active ? "Actif" : "Inactif"}</p></div>
          <div><p>Premium: ${user.premium ? "Oui" : "Non"}</p></div>
          <div><p>Balance: ${user.balance}</p></div>
          <div><p>Role: ${user.role}</p></div>
          <div><p>Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Jamais"}</p></div>
          <div><p>Created At: ${new Date(user.createdAt).toLocaleString()}</p></div>
          <div><p>Updated At: ${new Date(user.updatedAt).toLocaleString()}</p></div>
          <button id="editUserBtn">Modifier l'utilisateur</button>
          </div>
          `;
          if (window.currentUserRole == "admin"){
            userContent.innerHTML += `
          <div class="userForm">
          <form id="editUserForm" style="display:none; margin-top:20px;">
            <label>Nom : <input type="text" name="name" value="${user.name}" required></label><br>
            <label>blast ID : <input type="text" name="blastId" value="${user.blastId}" required></label><br>
            <label>Email : <input type="email" name="email" value="${user.email}" required></label><br>
            <label>Premium :
              <select name="premium">
                <option value="true" ${user.premium ? "selected" : ""}>Oui</option>
                <option value="false" ${!user.premium ? "selected" : ""}>Non</option>
              </select>
            </label><br>
            <label>Balance : <input type="number" name="balance" value="${user.balance}" step="any"></label><br>
            <button type="submit">Enregistrer</button>
            <button type="button" id="cancelEditUser">Annuler</button>
          </form>
          </div>
        `;
          }

        // Gestion du bouton d'édition
        document.getElementById("editUserBtn").onclick = function() {
          document.getElementById("editUserForm").style.display = "block";
          this.style.display = "none";
        };
        document.getElementById("cancelEditUser").onclick = function() {
          document.getElementById("editUserForm").style.display = "none";
          document.getElementById("editUserBtn").style.display = "inline-block";
        };
        document.getElementById("editUserForm").onsubmit = function(e) {
          e.preventDefault();
          const formData = new FormData(this);
          const name = formData.get("name").trim();
          const email = formData.get("email").trim();
          const premium = formData.get("premium") === "true";
          const balance = parseFloat(formData.get("balance"));

          // Sécurité : validation des champs
          if (!name || name.length > 100) {
            alert("Le nom est obligatoire et doit faire moins de 100 caractères.");
            return;
          }
          if (!email.match(/^[^@]+@[^@]+\.[^@]+$/) || email.length > 100) {
            alert("Email invalide ou trop long.");
            return;
          }
          if (isNaN(balance) || balance < 0) {
            alert("La balance doit être un nombre positif.");
            return;
          }

          const payload = { name, email, premium, balance };

          fetch(`http://127.0.0.1:3100/users/${encodeURIComponent(userId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json",
                      'x-api-key': 'fb_sk_live_3b7f29e1c4e14a509a8f4f97ae6aaf6b',
            },
            body: JSON.stringify(payload)
          })
            .then(res => res.json())
            .then(updated => {
              alert("Utilisateur mis à jour !");
              location.reload();
            })
            .catch((err) => {
              alert("Erreur lors de la mise à jour");
              console.error(err);
            });
        };
      }
    });
}