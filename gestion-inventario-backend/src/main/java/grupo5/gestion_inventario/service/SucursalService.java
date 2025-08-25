// backend/src/main/java/grupo5/gestion_inventario/service/SucursalService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.SucursalDto;
import grupo5.gestion_inventario.clientpanel.dto.SucursalRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SucursalService {

    private final SucursalRepository sucursalRepo;
    private final ClientRepository   clientRepo;

    @Transactional(readOnly = true)
    public List<SucursalDto> listByClient(Long clientId) {
        ensureClientExists(clientId);
        return sucursalRepo.findByClientId(clientId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SucursalDto create(Long clientId, SucursalRequest req) {
        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> notFound("Cliente no encontrado: " + clientId));

        if (req.getName() != null && !req.getName().isBlank()) {
            if (sucursalRepo.existsByClientIdAndNameIgnoreCase(clientId, req.getName())) {
                throw badRequest("Ya existe una sucursal con ese nombre para el cliente");
            }
        }

        Sucursal s = new Sucursal();
        s.setClient(client);
        s.setName(req.getName() != null ? req.getName() : "Sucursal");
        s.setAddress(req.getAddress());
        s.setActive(req.getActive() == null ? true : req.getActive());

        Sucursal saved = sucursalRepo.save(s);
        return toDto(saved);
    }

    @Transactional
    public SucursalDto update(Long clientId, Long sucursalId, SucursalRequest req) {
        Sucursal s = sucursalRepo.findByIdAndClientId(sucursalId, clientId)
                .orElseThrow(() -> notFound("Sucursal no encontrada"));

        if (req.getName() != null) {
            if (!req.getName().isBlank()
                    && !req.getName().equalsIgnoreCase(s.getName())
                    && sucursalRepo.existsByClientIdAndNameIgnoreCase(clientId, req.getName())) {
                throw badRequest("Ya existe una sucursal con ese nombre para el cliente");
            }
            s.setName(req.getName());
        }
        if (req.getAddress() != null) s.setAddress(req.getAddress());
        if (req.getActive() != null)  s.setActive(req.getActive());

        return toDto(sucursalRepo.save(s));
    }

    @Transactional
    public SucursalDto setActive(Long clientId, Long sucursalId, boolean active) {
        Sucursal s = sucursalRepo.findByIdAndClientId(sucursalId, clientId)
                .orElseThrow(() -> notFound("Sucursal no encontrada"));
        s.setActive(active);
        return toDto(sucursalRepo.save(s));
    }

    /* ----------------- helpers ----------------- */
    private void ensureClientExists(Long clientId) {
        if (!clientRepo.existsById(clientId)) {
            throw notFound("Cliente no encontrado: " + clientId);
        }
    }

    private SucursalDto toDto(Sucursal s) {
        return new SucursalDto(s.getId(), s.getName(), s.getAddress(), s.isActive());
    }

    private ResponseStatusException notFound(String msg) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, msg);
    }

    private ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
