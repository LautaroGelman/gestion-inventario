// backend/src/main/java/grupo5/gestion_inventario/model/Provider.java
package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "providers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true) // poné false si querés forzar nombre obligatorio
    private String name;

    @Column(nullable = true)
    private String address;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    // Conveniencia
    public Provider(String name, String address, Client client) {
        this.name = name;
        this.address = address;
        this.client = client;
    }
}
