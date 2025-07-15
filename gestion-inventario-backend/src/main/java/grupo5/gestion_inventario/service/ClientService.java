package grupo5.gestion_inventario.service;

import java.util.List;

import grupo5.gestion_inventario.clientpanel.dto.ClientCreateRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientService {

    private final ClientRepository   repo;
    private final EmployeeRepository employeeRepo;
    private final PasswordEncoder    passwordEncoder;

    public ClientService(ClientRepository repo,
                         EmployeeRepository employeeRepo,
                         PasswordEncoder passwordEncoder) {
        this.repo            = repo;
        this.employeeRepo    = employeeRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /** Crea un cliente y su empleado ADMINISTRADOR compartiendo la misma contraseña. */
    @Transactional
    public Client create(ClientCreateRequest req) {

        // 1) Codificar la contraseña UNA sola vez
        String hash = passwordEncoder.encode(req.getRawPassword());

        // 2) Guardar el CLIENTE
        Client cli = new Client();
        cli.setName(req.getName());
        cli.setEmail(req.getEmail());
        cli.setTelefono(req.getTelefono());
        cli.setPlan(req.getPlan());
        cli.setEstado(req.getEstado());
        cli.setPasswordHash(hash);
        Client saved = repo.save(cli);

        // 3) Guardar el EMPLOYEE administrador
        Employee admin = new Employee(
                req.getName() + " Admin",   // nombre
                req.getEmail(),             // mismo correo
                hash,                       // mismo hash
                EmployeeRole.ADMINISTRADOR,
                saved                       // relación
        );

        employeeRepo.save(admin);

        return saved;
    }

    /* ---------- CRUD y utilidades ---------- */

    public List<Client> findAll() { return repo.findAll(); }

    public Client findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }

    public Client update(Long id, Client data) {
        Client c = findById(id);
        c.setName(data.getName());
        c.setEmail(data.getEmail());
        return repo.save(c);
    }

    public void delete(Long id) { repo.deleteById(id); }

    public long countAll() { return repo.count(); }

    public long countByPlan(String plan) { return repo.countByPlan(plan); }

    public void inactivate(Long id) {
        Client c = findById(id);
        c.setEstado("INACTIVO");
        repo.save(c);
    }

    public void activate(Long id) {
        Client c = findById(id);
        c.setEstado("ACTIVO");
        repo.save(c);
    }
}
