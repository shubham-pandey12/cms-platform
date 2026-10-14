using Cms.Domain.Entities;

namespace Cms.Domain.Interfaces;

/// <summary>
/// Implemented by per-widget Definition classes under the widgets tree (flat or under an optional brand subfolder) so the seeder can discover them at runtime.
/// </summary>
public interface IWidgetDefinitionProvider
{
    WidgetDefinition GetDefinition();
}
