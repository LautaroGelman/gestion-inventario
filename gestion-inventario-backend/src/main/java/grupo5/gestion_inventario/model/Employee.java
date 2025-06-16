package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "employees")
public class Employee implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    // --- CAMPO CORREGIDO ---
    // Renombrado de 'password' a 'passwordHash' por consistencia con AdminUser y Client.
    // Esto deja claro que SIEMPRE guardamos un hash, no texto plano.
    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private EmployeeRole role;

    // La relación con Client está bien definida.
    // Usamos @JsonIgnore para evitar bucles de serialización de forma explícita.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    // Constructores, Getters y Setters
    public Employee() {}

    // Constructor actualizado para usar 'passwordHash'
    public Employee(String name, String email, String passwordHash, EmployeeRole role, Client client) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.client = client;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // --- MÉTODOS CORREGIDOS ---

    // El método getPassword() de UserDetails ahora devuelve el hash.
    // Spring Security sabe cómo manejar esto internamente.
    @Override
    public String getPassword() {
        return this.passwordHash;
    }

    // El método setter ahora se llama setPasswordHash para mayor claridad.
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public EmployeeRole getRole() { return role; }
    public void setRole(EmployeeRole role) { this.role = role; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }

    // --- Implementación de UserDetails (lógica de roles ya era correcta) ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // La lógica para convertir EmployeeRole a GrantedAuthority es correcta y flexible.
        if (this.role == EmployeeRole.MULTIFUNCION) {
            return List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"), new SimpleGrantedAuthority("ROLE_CAJERO"));
        }
        // Usar un Set en lugar de una Lista previene duplicados, aunque en este caso no habría.
        return Set.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}