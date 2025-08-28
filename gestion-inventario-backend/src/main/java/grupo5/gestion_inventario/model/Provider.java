package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "providers")
@Getter @Setter @NoArgsConstructor
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nombres normalizados (en inglés)
    @Column(nullable = false)
    private String name;

    private String contact;
    private String address;
    private String phone;
    private String email;
    private String notes;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonIgnore
    private Client client;

    // Relación inversa con productos
    @ManyToMany(mappedBy = "providers", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("providers")
    private Set<Product> products = new HashSet<>();

    public Provider(String name, String contact, String address,
                    String phone, String email, String notes, Client client) {
        this.name = name;
        this.contact = contact;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.notes = notes;
        this.client = client;
    }
}
