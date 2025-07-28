package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import grupo5.gestion_inventario.clientpanel.model.HoursWorked; // <-- IMPORTACIÓN AÑADIDA
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "employees")
public class Employee implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private EmployeeRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    // --- RELACIÓN AÑADIDA ---
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<HoursWorked> hoursWorked;

    public Employee() {}

    public Employee(String name, String email, String passwordHash, EmployeeRole role, Client client) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.client = client;
    }

    // --- Getters y Setters (incluyendo el nuevo) ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @Override
    public String getPassword() {
        return this.passwordHash;
    }
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public EmployeeRole getRole() { return role; }
    public void setRole(EmployeeRole role) { this.role = role; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }

    // --- GETTER Y SETTER AÑADIDOS ---
    public List<HoursWorked> getHoursWorked() { return hoursWorked; }
    public void setHoursWorked(List<HoursWorked> hoursWorked) { this.hoursWorked = hoursWorked; }


    // --- Métodos de UserDetails (sin cambios) ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        switch (this.role) {
            case CAJERO:
                return List.of(new SimpleGrantedAuthority("ROLE_CAJERO"));
            case INVENTARIO:
                return List.of(new SimpleGrantedAuthority("ROLE_INVENTARIO"));
            case VENTAS_INVENTARIO:
                return List.of(new SimpleGrantedAuthority("ROLE_CAJERO"), new SimpleGrantedAuthority("ROLE_INVENTARIO"));
            case MULTIFUNCION:
                return List.of(new SimpleGrantedAuthority("ROLE_CAJERO"), new SimpleGrantedAuthority("ROLE_INVENTARIO"));
            default: // ADMINISTRADOR
                return List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
        }
    }

    @Override
    public String getUsername() { return this.email; }
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}