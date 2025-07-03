package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.TemplateCreateDto;
import grupo5.gestion_inventario.clientpanel.dto.TemplateUpdateDto;
import grupo5.gestion_inventario.clientpanel.model.ExpenseCategory;
import grupo5.gestion_inventario.clientpanel.model.ExpenseTemplate;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseCategoryRepository;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseTemplateRepository;
import java.time.LocalDate;
import java.util.List;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpenseTemplateService {

    private final ExpenseTemplateRepository tplRepo;
    private final ExpenseCategoryRepository catRepo;
    private final ClientRepository clientRepo;

    @Transactional
    public ExpenseTemplate create(Long clientId, TemplateCreateDto dto) {
        Client client = clientRepo.getReferenceById(clientId);
        ExpenseCategory cat = catRepo.findByIdAndClientId(dto.categoryId(), clientId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría inválida"));

        ExpenseTemplate tpl = new ExpenseTemplate();
        tpl.setClient(client);
        tpl.setCategory(cat);
        tpl.setAmount(dto.amount());
        tpl.setRecurring(dto.recurring());
        tpl.setEffectiveFrom(dto.effectiveFrom() == null ? LocalDate.now() : dto.effectiveFrom());
        tpl.setDescription(dto.description());

        return tplRepo.save(tpl);
    }

    @Transactional
    public ExpenseTemplate update(Long clientId, Long tplId, TemplateUpdateDto dto) {
        ExpenseTemplate tpl = tplRepo.findById(tplId)
                .filter(t -> t.getClient().getId().equals(clientId))
                .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada"));

        if (dto.amount() != null)        tpl.setAmount(dto.amount());
        if (dto.recurring() != null)     tpl.setRecurring(dto.recurring());
        if (dto.effectiveFrom() != null) tpl.setEffectiveFrom(dto.effectiveFrom());
        if (dto.description() != null)   tpl.setDescription(dto.description());

        return tpl;
    }

    @Transactional
    public void delete(Long clientId, Long tplId) {
        tplRepo.findById(tplId)
                .filter(t -> t.getClient().getId().equals(clientId))
                .ifPresent(tplRepo::delete);
    }

    /**
     * Listar todas las plantillas (recurrentes o no) de un cliente.
     */
    @Transactional(readOnly = true)
    public List<ExpenseTemplate> findByClient(Long clientId) {
        return tplRepo.findByClientId(clientId);
    }
}
