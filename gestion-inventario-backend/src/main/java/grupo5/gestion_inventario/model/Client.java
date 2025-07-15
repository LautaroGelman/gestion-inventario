package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "client") // Nos aseguramos de que el nombre de la tabla sea "client" en singular.
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;                       // Se usará como “username”

    @Column(nullable = false)
    private String passwordHash;                // Correcto: SIEMPRE BCrypt, no guardamos contraseñas en texto plano.

    @Column(precision = 5, scale = 2)
    private BigDecimal taxPercentage;

    private String telefono;
    private String plan;
    private String estado;

    /* -------- Relaciones -------- */

    // La anotación @JsonManagedReference puede ser compleja y propensa a errores.
    // La reemplazamos con @JsonIgnore para una solución más simple y robusta
    // que previene bucles infinitos al convertir a JSON.
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Product> products;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Esta ya estaba correcta. La mantenemos por consistencia.
    private Set<Employee> employees;

    /* -------- Getters y Setters -------- */
    // Es crucial que todos los campos tengan sus getters y setters para que JPA y Jackson funcionen bien.

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }
    public Set<Employee> getEmployees() { return employees; }
    public void setEmployees(Set<Employee> employees) { this.employees = employees; }
}