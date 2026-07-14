// Load notices from JSON
fetch("assets/data/notices.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("notices-marquee").innerText =
      data.map(n => `${n.date}: ${n.title}`).join(" | ");
  });

// Load projects from JSON
fetch("assets/data/projects.json")
  .then(res => res.json())
  .then(data => {
    let container = document.getElementById("projects-section");
    data.forEach(p => {
      container.innerHTML += `
        <div class="col-md-4 mb-3">
          <div class="card">
            <img src="assets/img/${p.image}" class="card-img-top" alt="${p.title}">
            <div class="card-body">
              <h5>${p.title}</h5>
              <p>${p.summary}</p>
            </div>
          </div>
        </div>`;
    });
  });
