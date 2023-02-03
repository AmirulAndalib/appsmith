package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@Deprecated
public class Page extends BaseDomain {
    @JsonView(Views.Public.class)
    String name;

    @NotNull
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    List<Layout> layouts;
}
