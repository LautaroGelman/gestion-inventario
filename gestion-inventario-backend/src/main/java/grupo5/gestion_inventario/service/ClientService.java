// backend/src/main/java/grupo5/gestion_inventario/service/ClientService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ClientCreateRequest;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository     repo;
    private final EmployeeRepository   employeeRepo;
    private final SucursalRepository   sucursalRepo;
    private final PasswordEncoder      passwordEncoder;

    public ClientService(ClientRepository   repo,
                         EmployeeRepository employeeRepo,
                         SucursalRepository sucursalRepo,
                         PasswordEncoder    passwordEncoder) {
        this.repo            = repo;
        this.employeeRepo    = employeeRepo;
        this.sucursalRepo    = sucursalRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /** Crea el Cliente, su primera Sucursal (“Sucursal Principal”) y el empleado PROPIETARIO. */
    @Transactional
    public Client create(ClientCreateRequest req) {

        /* 1) Codificar la contraseña una sola vez */
        String hash = passwordEncoder.encode(req.getRawPassword());

        /* 2) Guardar el CLIENTE */
        Client cli = new Client();
        cli.setName     (req.getName());
        cli.setEmail    (req.getEmail());
        cli.setTelefono (req.getTelefono());
        cli.setPlan     (req.getPlan());
        cli.setEstado   (req.getEstado());
        cli.setPasswordHash(hash);
        Client savedClient = repo.save(cli);

        /* 3) Crear la Sucursal principal */
        Sucursal principal = new Sucursal(
                "Sucursal Principal",
                null,               // dirección opcional: ajustá si tu DTO la trae
                savedClient
        );
        sucursalRepo.save(principal);     // persiste y vincula al cliente

        /* 4) Crear el empleado PROPIETARIO (sin sucursal) */
        Employee owner = new Employee(
                req.getName() + " Propietario",
                req.getEmail(),
                hash,
                EmployeeRole.PROPIETARIO,
                savedClient,
                null                // ← ninguna sucursal
        );
        employeeRepo.save(owner);

        return savedClient;
    }

    /* ---------- CRUD y utilidades ---------- */

    public List<Client> findAll()                     { return repo.findAll(); }
    public Client findById(Long id)                   { return repo.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado")); }
    public Client update(Long id, Client data)        { Client c = findById(id); c.setName(data.getName()); c.setEmail(data.getEmail()); return repo.save(c); }
    public void  delete(Long id)                      { repo.deleteById(id); }
    public long  countAll()                           { return repo.count(); }
    public long  countByPlan(String plan)             { return repo.countByPlan(plan); }
    public void  inactivate(Long id)                  { Client c = findById(id); c.setEstado("INACTIVO"); repo.save(c); }
    public void  activate(Long id)                    { Client c = findById(id); c.setEstado("ACTIVO"); repo.save(c); }
}
